import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

const authSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
}

function FormField({ 
  id, 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  error,
  required = true,
  showPasswordToggle = false 
}: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
      >
        {label}
        {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "pr-10",
            error && "border-destructive focus:border-destructive focus:ring-destructive/10"
          )}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p 
          id={`${id}-error`} 
          className="flex items-center gap-1.5 text-xs text-[hsl(0,85%,75%)]"
          role="alert"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (type: 'signin' | 'signup') => {
    if (!validateForm()) return;
    
    setLoading(true);

    const { error } = type === 'signin' 
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      let message = error.message;
      if (error.message.includes('Invalid login credentials')) {
        message = 'Email ou senha incorretos';
      } else if (error.message.includes('User already registered')) {
        message = 'Este email já está cadastrado';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Confirme seu email antes de fazer login';
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: message,
      });
      return;
    }

    if (type === 'signup') {
      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar o cadastro.',
      });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Auth Card */}
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src={logo} alt="King of Languages" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-display font-bold text-foreground">
              King of Languages
            </span>
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            Bem-vindo ao Dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie suas campanhas de marketing
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-[hsl(215,35%,11%)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit('signin');
                }}
              >
                <FormField
                  id="email-signin"
                  label="Email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  error={errors.email}
                />
                
                <FormField
                  id="password-signin"
                  label="Senha"
                  type="password"
                  placeholder="••••••"
                  value={password}
                  onChange={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  error={errors.password}
                  showPasswordToggle
                />

                <div className="pt-2">
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form 
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit('signup');
                }}
              >
                <FormField
                  id="email-signup"
                  label="Email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(val) => {
                    setEmail(val);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  error={errors.email}
                />
                
                <FormField
                  id="password-signup"
                  label="Senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  error={errors.password}
                  showPasswordToggle
                />

                <div className="pt-2">
                  <Button 
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos{' '}
                  <a href="#" className="text-primary hover:underline">
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 King of Languages. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
