import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, UserRoleEnum } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Componentes
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Layout
import Layout from "@/components/Layout";

// Schema para o formulário de adicionar pontos
const pointsFormSchema = z.object({
  points: z.coerce.number().int().min(1, "Mínimo de 1 ponto"),
  description: z.string().min(3, "Descrição é obrigatória"),
});

type PointsFormValues = z.infer<typeof pointsFormSchema>;

// Schema para o formulário de registro
const registerSchema = z.object({
  username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email inválido"),
  displayName: z.string().optional(),
  role: z.enum([UserRoleEnum.ADMIN, UserRoleEnum.EMPLOYEE]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function EmployeesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isPointsDialogOpen, setIsPointsDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);

  // Consulta para obter todos os funcionários
  const { data: employees, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/employees'],
    enabled: !!isAdmin,
  });

  // Formulário para adicionar pontos
  const pointsForm = useForm<PointsFormValues>({
    resolver: zodResolver(pointsFormSchema),
    defaultValues: {
      points: 10,
      description: "",
    },
  });

  // Formulário para registrar novo funcionário
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      displayName: "",
      role: UserRoleEnum.EMPLOYEE,
    },
  });

  // Mutação para adicionar pontos
  const addPointsMutation = useMutation({
    mutationFn: async ({ userId, points, description }: { userId: number; points: number; description: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/points`, { points, description });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setIsPointsDialogOpen(false);
      pointsForm.reset();
      toast({
        title: "Pontos adicionados com sucesso",
        description: "Os pontos foram creditados na conta do funcionário.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar pontos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para registrar novo funcionário
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/employees'] });
      setIsRegisterDialogOpen(false);
      registerForm.reset();
      toast({
        title: "Funcionário registrado com sucesso",
        description: "O novo funcionário foi adicionado ao sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar funcionário",
        description: error.message || "Não foi possível criar a conta. Tente outro nome de usuário.",
        variant: "destructive",
      });
    },
  });

  // Handler para abrir o diálogo de adicionar pontos
  const handleOpenPointsDialog = (employee: User) => {
    setSelectedEmployee(employee);
    setIsPointsDialogOpen(true);
  };

  // Handler para o envio do formulário de pontos
  const onSubmitPoints = (values: PointsFormValues) => {
    if (!selectedEmployee) return;
    
    addPointsMutation.mutate({
      userId: selectedEmployee.id,
      points: values.points,
      description: values.description,
    });
  };

  // Handler para o envio do formulário de registro
  const onSubmitRegister = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-10">
          <p className="text-red-500">Erro ao carregar funcionários: {error instanceof Error ? error.message : "Erro desconhecido"}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Funcionários</h1>
          <Button onClick={() => setIsRegisterDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>

        {employees && employees.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableCaption>Lista de funcionários da empresa</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Data de Registro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.displayName || employee.username}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <Badge variant={employee.role === UserRoleEnum.ADMIN ? "default" : "outline"}>
                          {employee.role === UserRoleEnum.ADMIN ? "Administrador" : "Funcionário"}
                        </Badge>
                      </TableCell>
                      <TableCell>{employee.points} pts</TableCell>
                      <TableCell>
                        {employee.createdAt ? 
                          format(new Date(employee.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 
                          "N/A"}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenPointsDialog(employee)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Adicionar Pontos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Nenhum funcionário encontrado</CardTitle>
              <CardDescription>
                Cadastre funcionários para que eles possam utilizar o sistema de pontos.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {/* Dialog para adicionar pontos */}
      <Dialog open={isPointsDialogOpen} onOpenChange={setIsPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Pontos</DialogTitle>
            <DialogDescription>
              Adicione pontos à conta de {selectedEmployee?.displayName || selectedEmployee?.username}.
              Atualmente possui {selectedEmployee?.points || 0} pontos.
            </DialogDescription>
          </DialogHeader>

          <Form {...pointsForm}>
            <form onSubmit={pointsForm.handleSubmit(onSubmitPoints)} className="space-y-4">
              <FormField
                control={pointsForm.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Pontos</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} min={1} />
                    </FormControl>
                    <FormDescription>
                      Número de pontos a serem adicionados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pointsForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Participação em projeto" />
                    </FormControl>
                    <FormDescription>
                      Motivo pelo qual os pontos estão sendo adicionados
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPointsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPointsMutation.isPending}
                >
                  {addPointsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    "Adicionar Pontos"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog para registrar novo funcionário */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Funcionário</DialogTitle>
            <DialogDescription>
              Preencha os detalhes abaixo para cadastrar um novo funcionário no sistema.
            </DialogDescription>
          </DialogHeader>

          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onSubmitRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de usuário</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="nome_usuario" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="funcionario@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de exibição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome Completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="******" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRoleEnum.EMPLOYEE}>Funcionário</SelectItem>
                        <SelectItem value={UserRoleEnum.ADMIN}>Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsRegisterDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    "Cadastrar Funcionário"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}