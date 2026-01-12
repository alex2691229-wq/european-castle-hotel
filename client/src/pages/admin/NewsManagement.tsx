import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

type NewsType = "announcement" | "promotion" | "event";

export default function NewsManagement() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement" as NewsType,
  });

  const utils = trpc.useUtils();
  const { data: news, isLoading } = trpc.news.list.useQuery();
  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate();
    },
  });
  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate();
    },
  });
  const deleteMutation = trpc.news.delete.useMutation({
    onSuccess: () => {
      utils.news.list.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: formData.title,
          content: formData.content,
          type: formData.type,
        });
        toast.success("消息已更新");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          content: formData.content,
          type: formData.type,
        });
        toast.success("消息已新增");
      }

      setFormData({
        title: "",
        content: "",
        type: "announcement",
      });
    } catch (error) {
      toast.error("操作失敗，請重試");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      type: item.type,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm("確定要刪除此消息嗎？")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("消息已刪除");
      } catch (error) {
        toast.error("刪除失敗，請重試");
      }
    }
  };

  const getTypeLabel = (type: NewsType) => {
    switch (type) {
      case "announcement":
        return "公告";
      case "promotion":
        return "優惠活動";
      case "event":
        return "活動";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {editingId ? "編輯消息" : "新增消息"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              標題 *
            </label>
            <Input
              type="text"
              placeholder="例：春季優惠活動開始"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="bg-background border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              內容 *
            </label>
            <Textarea
              placeholder="消息詳細內容"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              類型
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as NewsType,
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
            >
              <option value="announcement">公告</option>
              <option value="promotion">優惠活動</option>
              <option value="event">活動</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {editingId ? "更新消息" : "新增消息"}
                </>
              )}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: "",
                    content: "",
                    type: "announcement",
                  });
                }}
              >
                取消編輯
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">消息列表</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : news && news.length > 0 ? (
          <div className="space-y-3">
            {news.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getTypeLabel(item.type)} ·{" "}
                    {new Date(item.publishedAt).toLocaleDateString("zh-TW")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            尚無消息資料
          </p>
        )}
      </Card>
    </div>
  );
}
