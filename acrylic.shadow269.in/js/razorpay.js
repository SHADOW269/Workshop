// ===== RAZORPAY CHECKOUT =====
window.initiateRazorpayCheckout = function(totalAmount, customerInfo = {}) {
  const options = {
    key: "YOUR_RAZORPAY_KEY", // Replace with your live/test key
    amount: totalAmount * 100, // in paise
    currency: "INR",
    name: "Shop Shadow269",
    description: "Acrylic 3-in-1 Keyboard Armrest Cover",
    image: "/assets/logo/logo.png",
    prefill: {
      name: customerInfo.name || "",
      email: customerInfo.email || "",
      contact: customerInfo.phone || ""
    },
    theme: {
      color: "#8B5CF6"
    },
    handler: function(response) {
      // Payment success
      localStorage.setItem('shadow269_last_order', JSON.stringify({
        payment_id: response.razorpay_payment_id,
        order_id: response.razorpay_order_id,
        amount: totalAmount,
        items: JSON.parse(localStorage.getItem('shadow269_cart') || '[]'),
        timestamp: new Date().toISOString()
      }));
      // Clear cart
      localStorage.removeItem('shadow269_cart');
      // Redirect to success page
      window.location.href = '/checkout/success.html';
    },
    modal: {
      ondismiss: function() {
        console.log('Checkout dismissed');
      }
    }
  };

  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response) {
    alert('Payment failed. Please try again.\n' + response.error.description);
  });
  rzp.open();
};
