import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/pages/Home';
import MatchAnalysis from '@/pages/MatchAnalysis';
import DailySelection from '@/pages/DailySelection';
import Fixtures from '@/pages/Fixtures';
import Slips from '@/pages/Slips';
import Account from '@/pages/Account';
import { LoginPage, RegisterPage } from '@/pages/Auth';
import Results from '@/pages/Results';
import Vip from '@/pages/Vip';
import News from '@/pages/News';
import NewsArticle from '@/pages/NewsArticle';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/match/:fixture_id" component={MatchAnalysis} />
      <Route path="/selection" component={DailySelection} />
      <Route path="/fixtures" component={Fixtures} />
      <Route path="/slips" component={Slips} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/account" component={Account} />
      <Route path="/results" component={Results} />
      <Route path="/vip" component={Vip} />
      <Route path="/news" component={News} />
      <Route path="/news/:slug" component={NewsArticle} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
