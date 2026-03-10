import { lazy, Suspense } from "react";
import { LazyMotion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const Index = lazy(() => import("./pages/Index"));

const Results = lazy(() => import("./pages/Results"));
const History = lazy(() => import("./pages/History"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LazyToaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const LazySonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const LazyTooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));

const loadMotionFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={null}>
      <LazyTooltipProvider>
        <LazyMotion features={loadMotionFeatures} strict={false}>
          <LazyToaster />
          <LazySonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Suspense fallback={null}><Index /></Suspense>} />
              <Route path="/results" element={<Suspense fallback={null}><Results /></Suspense>} />
              <Route path="/history" element={<Suspense fallback={null}><History /></Suspense>} />
              <Route path="*" element={<Suspense fallback={null}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </LazyMotion>
      </LazyTooltipProvider>
    </Suspense>
  </QueryClientProvider>
);

export default App;
