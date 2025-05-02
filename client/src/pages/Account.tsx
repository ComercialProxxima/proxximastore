import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Layout from "@/components/Layout";
import { Loader2, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

const profileSchema = z.object({
  displayName: z.string().min(3, "O nome de exibição deve ter pelo menos 3 caracteres").optional().nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres").optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Se o usuário estiver tentando alterar a senha
  if (data.newPassword || data.confirmPassword) {
    // Verificar se as senhas coincidem
    if (data.newPassword !== data.confirmPassword) return false;
    
    // Se estiver tentando definir uma nova senha, a senha atual deve ser fornecida
    if (data.newPassword && !data.currentPassword) return false;
  }
  return true;
}, {
  message: "As senhas não coincidem ou senha atual não fornecida",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Account() {
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      const res = await apiRequest("PATCH", "/api/protected/profile", data);
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
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
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
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-white text-lg">
                  {user.displayName ? 
                    user.displayName.split(' ').map(name => name[0]).join('').toUpperCase() : 
                    <UserIcon className="h-6 w-6" />
                  }
                </AvatarFallback>
              </Avatar>
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
                          <Input placeholder="Seu nome completo (opcional)" {...field} value={field.value || ""} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Nome que será exibido no sistema. Mínimo de 3 caracteres.
                        </p>
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
                  <h4 className="text-base font-medium">Alterar Senha</h4>
                  
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha Atual</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Necessária apenas para alterar senha" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Obrigatória apenas se você quiser alterar sua senha
                        </p>
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
                            <Input type="password" placeholder="Opcional" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Mínimo de 6 caracteres
                          </p>
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
                            <Input type="password" placeholder="Opcional" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Deve ser igual à nova senha
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
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
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum campo é obrigatório para salvar. Preencha apenas os campos que deseja alterar.
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}