import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    role: "user" as "user" | "admin",
  });

  // Queries
  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery();

  // Mutations
  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      toast.success("帳號已新增");
      setIsOpen(false);
      setFormData({ username: "", name: "", role: "user" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "新增失敗");
    },
  });

  const updateMutation = trpc.accounts.update.useMutation({
    onSuccess: () => {
      toast.success("帳號已更新");
      setIsOpen(false);
      setEditingId(null);
      setFormData({ username: "", name: "", role: "user" });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      toast.success("帳號已刪除");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const toggleStatusMutation = trpc.accounts.toggleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.status === "active" ? "帳號已啟用" : "帳號已停用");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "操作失敗");
    },
  });

  const handleOpenDialog = (account?: any) => {
    if (account) {
      setEditingId(account.id);
      setFormData({
        username: account.username || "",
        name: account.name || "",
        role: account.role as "user" | "admin",
      });
    } else {
      setEditingId(null);
      setFormData({ username: "", name: "", role: "user" });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error("請填寫員工名稱");
      return;
    }

    if (editingId) {
      // Update
      await updateMutation.mutateAsync({
        id: editingId,
        name: formData.name,
        role: formData.role,
      });
    } else {
      // Create
      if (!formData.username) {
        toast.error("請填寫用戶名");
        return;
      }
      await createMutation.mutateAsync({
        username: formData.username,
        name: formData.name,
        role: formData.role,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此帳號嗎？")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    await toggleStatusMutation.mutateAsync({ id });
  };

  if (isLoading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">帳戶管理</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              新增帳號
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "編輯帳號" : "新增帳號"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    用戶名
                  </label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="輸入用戶名"
                    disabled={editingId !== null}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  員工名稱
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="輸入員工名稱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  角色
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as "user" | "admin",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">員工</SelectItem>
                    <SelectItem value="admin">管理員</SelectItem>
                  </SelectContent>
                </Select>
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

      {accounts && accounts.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-foreground">用戶名</TableHead>
                <TableHead className="text-foreground">名稱</TableHead>
                <TableHead className="text-foreground">角色</TableHead>
                <TableHead className="text-foreground">最後登入</TableHead>
                <TableHead className="text-foreground">狀態</TableHead>
                <TableHead className="text-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium text-foreground">
                    {account.username || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {account.name || "-"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        account.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {account.role === "admin" ? "管理員" : "員工"}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {account.lastSignedIn
                      ? new Date(account.lastSignedIn).toLocaleString("zh-TW", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "從未登入"}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        account.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {account.status === "active" ? "啟用" : "停用"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={account.status === "active" ? "outline" : "default"}
                        onClick={() => handleToggleStatus(account.id, account.status)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {account.status === "active" ? "停用" : "啟用"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(account)}
                      >
                        編輯
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleteMutation.isPending}
                      >
                        刪除
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
          還沒有帳號。點擊「新增帳號」按鈕來新增第一個帳號。
        </div>
      )}
    </div>
  );
}
