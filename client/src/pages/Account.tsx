import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Layout from "@/components/Layout";
import { Loader2, User as UserIcon, Camera, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  displayName: z.string().min(3, "O nome de exibição deve ter pelo menos 3 caracteres").optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Se estiver alterando a senha, a confirmação deve coincidir
  if (data.newPassword && !data.confirmPassword) return false;
  if (!data.newPassword && data.confirmPassword) return false;
  if (data.newPassword && data.confirmPassword && data.newPassword !== data.confirmPassword) return false;
  
  // Se estiver alterando a senha, a senha atual é obrigatória
  if (data.newPassword && !data.currentPassword) return false;
  
  return true;
}, {
  message: "Verifique os campos de senha. Senha atual é obrigatória para alterar a senha e as novas senhas devem coincidir.",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Account() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImageUrl || null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const formData = new FormData();
      
      // Adicionar campos de texto ao FormData
      if (data.displayName) formData.append("displayName", data.displayName);
      if (data.currentPassword) formData.append("currentPassword", data.currentPassword);
      if (data.newPassword) formData.append("newPassword", data.newPassword);
      
      // Adicionar imagem se existir
      if (selectedImage) {
        formData.append("profileImage", selectedImage);
      }
      
      const res = await fetch("/api/protected/profile", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao atualizar perfil");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      form.reset({
        ...form.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      // Limpar imagem selecionada após sucesso
      setSelectedImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const res = await fetch("/api/protected/profile", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao atualizar foto de perfil");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Foto de perfil atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
      setSelectedImage(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar foto de perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Criar URL de preview para a imagem selecionada
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Perguntar ao usuário se deseja atualizar a foto imediatamente
      const confirmUpdate = confirm("Deseja atualizar sua foto de perfil agora?");
      if (confirmUpdate) {
        updateProfileImageMutation.mutate(file);
      }
      
      // Limpar URL quando o componente for desmontado
      return () => URL.revokeObjectURL(objectUrl);
    }
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const saveProfileImage = () => {
    if (selectedImage) {
      updateProfileImageMutation.mutate(selectedImage);
    }
  };
  
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Perfil de Usuário</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Gerencie suas informações pessoais e senha</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 cursor-pointer border-2 border-primary/20 hover:border-primary/50 transition-colors duration-200">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Foto de perfil" />
                  ) : (
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {user.displayName ? 
                        user.displayName.split(' ').map(name => name[0]).join('').toUpperCase() : 
                        <UserIcon className="h-10 w-10" />
                      }
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 text-white transition-opacity duration-200">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full" 
                    onClick={triggerFileInput}
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                  
                  {previewUrl && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full ml-1" 
                      onClick={handleRemoveImage}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium">{user.displayName || user.username}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {user.role === "admin" ? "Administrador" : "Funcionário"}
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-secondary">
                    {user.points} xCoins
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">Clique na imagem para alterar sua foto de perfil</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-base font-medium">Informações de Perfil</h4>
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Exibição</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Nome de Usuário</p>
                      <p className="text-sm text-muted-foreground">{user.username}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-medium">Alterar Senha</h4>
                    <p className="text-xs text-muted-foreground">
                      Preencha apenas se desejar alterar sua senha
                    </p>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} placeholder="Necessária apenas para alteração de senha" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Digite uma nova senha (opcional)" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Confirme a nova senha" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}