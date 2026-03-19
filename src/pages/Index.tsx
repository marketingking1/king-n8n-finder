import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Crown, Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Crown className="h-16 w-16 text-primary mb-4" />
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="mt-4 text-muted-foreground">Carregando...</p>
    </div>
  );
};

export default Index;
