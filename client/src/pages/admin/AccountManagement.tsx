import React from 'react';
// @ts-nocheck
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AccountManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
  });

  // Queries
  const { data: admins = [], isLoading, refetch } = trpc.auth.listAdmins.useQuery();

  // Mutations
  const createMutation = trpc.auth.createAdmin.useMutation({
    onSuccess: () => {
      toast.success("管理員帳號已新增");
      setIsOpen(false);
      setFormData({ username: "", name: "", password: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "新增失敗");
    },
  });

  const updateMutation = trpc.auth.updateAdmin.useMutation({
    onSuccess: () => {
      toast.success("管理員帳號已更新");
      setIsOpen(false);
      setEditingId(null);
      setFormData({ username: "", name: "", password: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteMutation = trpc.auth.deleteAdmin.useMutation({
    onSuccess: () => {
      toast.success("管理員帳號已刪除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const handleOpenDialog = (admin?: any) => {
    if (admin) {
      setEditingId(admin.id);
      setFormData({
        username: admin.username || "",
        name: admin.name || "",
        password: "",
      });
    } else {
      setEditingId(null);
      setFormData({ username: "", name: "", password: "" });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("請填寫名稱");
      return;
    }

    if (editingId) {
      // Update
      const updateData: any = {
        id: editingId,
        name: formData.name,
      };
          if (!formData.username) {
                  toast.error("請填寫用戶名");
                  return;
                }
      if (formData.password) {
        updateData.password = formData.password;
      }
      await updateMutation.mutateAsync(updateData);
    } else {
      // Create
      if (!formData.username) {
        toast.error("請填寫用戶名");
        return;
      }
      if (!formData.password) {
        toast.error("請設置密碼");
        return;
      }
      await createMutation.mutateAsync({
        username: formData.username,
        name: formData.name,
        password: formData.password,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此帳號嗎？")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">管理員帳號管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理系統的管理員帳號和權限
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              新增管理員
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "編輯管理員帳號" : "新增管理員帳號"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    用戶名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="輸入用戶名（至少3個字符）"
                    disabled={editingId !== null}
                    minLength={3}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  名稱 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="輸入名稱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {editingId ? "新密碼（留空不修改）" : "密碼"} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={editingId ? "留空不修改密碼" : "設置密碼（至少6個字符）"}
                  minLength={editingId ? 0 : 6}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {editingId ? "更新" : "新增"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6 bg-card border-border">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : admins && admins.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-foreground">用戶名</TableHead>
                  <TableHead className="text-foreground">名稱</TableHead>
                  <TableHead className="text-foreground">狀態</TableHead>
                  <TableHead className="text-foreground">最後登入</TableHead>
                  <TableHead className="text-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin: any) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium text-foreground">
                      {admin.username || "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {admin.name || "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          admin.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {admin.status === "active" ? "啟用" : "停用"}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {admin.lastSignedIn
                        ? new Date(admin.lastSignedIn).toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "從未登入"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(admin)}
                          disabled={updateMutation.isPending}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(admin.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            還沒有管理員帳號。點擊「新增管理員」按鈕來新增第一個帳號。
          </div>
        )}
      </Card>
    </div>
  );
}
