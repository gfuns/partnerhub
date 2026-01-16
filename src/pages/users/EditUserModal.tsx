import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import usersService, { User, Role, UpdateUserRequest } from '@/services/api/users.service';

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  roles: Role[];
  onSuccess: () => void;
}

export default function EditUserModal({
  open,
  onOpenChange,
  user,
  roles,
  onSuccess,
}: EditUserModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    role: user.role,
    status: user.status,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData({
      role: user.role,
      status: user.status,
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check if anything changed
    if (formData.role === user.role && formData.status === user.status) {
      toast({
        title: 'No changes',
        description: 'No changes were made to the user.',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await usersService.updateUser(user.context_id, formData);

      if (response.success) {
        toast({
          title: 'Success',
          description: response.message || 'User updated successfully',
        });
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        setErrors(apiErrors);
      }
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find((r) => r.value === formData.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update role and status for {user.first_name} {user.last_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Information</Label>
              <div className="rounded-lg border p-3 space-y-1 bg-muted/50">
                <p className="font-medium">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.value !== 'partner_owner')
                    .map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{role.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role}</p>
              )}
              {selectedRole && (
                <p className="text-sm text-muted-foreground">
                  {selectedRole.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex flex-col">
                      <span className="font-medium">Active</span>
                      <span className="text-xs text-muted-foreground">
                        User can access the system
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="disabled">
                    <div className="flex flex-col">
                      <span className="font-medium">Disabled</span>
                      <span className="text-xs text-muted-foreground">
                        User cannot access the system
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-destructive">{errors.status}</p>
              )}
            </div>

            {(formData.role !== user.role || formData.status !== user.status) && (
              <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
                <p className="text-sm text-warning-foreground">
                  <strong>Changes to be made:</strong>
                </p>
                <ul className="mt-2 text-sm text-warning-foreground space-y-1">
                  {formData.role !== user.role && (
                    <li>
                      • Role: {user.role_label} → {roles.find((r) => r.value === formData.role)?.label}
                    </li>
                  )}
                  {formData.status !== user.status && (
                    <li>
                      • Status: {user.status} → {formData.status}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
