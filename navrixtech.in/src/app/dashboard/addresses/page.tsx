"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AddressForm, {
  type AddressInput,
} from "@/components/checkout/address-form";

type Address = AddressInput & {
  id: string;
  createdAt?: string;
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAddresses = async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSubmit = async (data: AddressInput) => {
    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/addresses/${editing.id}` : "/api/addresses",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        toast.error(result?.error ?? "Failed to save address");
        return;
      }

      toast.success(editing ? "Address updated" : "Address added");
      setDialogOpen(false);
      setEditing(null);
      await loadAddresses();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: Address) => {
    if (!window.confirm(`Delete address for ${address.fullName}?`)) return;
    setDeletingId(address.id);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete address");
        return;
      }
      toast.success("Address deleted");
      await loadAddresses();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (address: Address) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...address, isDefault: true }),
      });
      if (!res.ok) {
        toast.error("Failed to set default address");
        return;
      }
      toast.success("Default address updated");
      await loadAddresses();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Addresses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your saved delivery addresses.
          </p>
        </div>
        <Button variant="gradient" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <MapPin className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No saved addresses</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add an address to make checkout faster.
              </p>
            </div>
            <Button variant="gradient" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {address.fullName}
                  {address.isDefault && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">
                      <Star className="h-3 w-3 fill-primary" />
                      Default
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} — {address.pincode}
                  </p>
                  <p>{address.country}</p>
                  <p className="mt-1 text-foreground">Phone: {address.phone}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(address)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address)}
                    disabled={deletingId === address.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === address.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleSetDefault(address)}
                      disabled={saving}
                    >
                      Set Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <AddressForm
            key={editing?.id ?? "new"}
            onSubmit={handleSubmit}
            loading={saving}
            initialData={editing ?? undefined}
            submitLabel={editing ? "Update Address" : "Add Address"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
