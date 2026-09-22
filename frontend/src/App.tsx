import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AnalyticsLayout } from "./components/AnalyticsLayout";
import { Header } from "./components/Header";
import { ThemeProvider } from "./hooks/useTheme.tsx";
import { AnalyticsCountriesPage } from "./pages/AnalyticsCountriesPage";
import { AnalyticsHomePage } from "./pages/AnalyticsHomePage";
import { AnalyticsProfessionsPage } from "./pages/AnalyticsProfessionsPage";
import { MemberDetailPage } from "./pages/MemberDetailPage";
import { MemberListPage } from "./pages/MemberListPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Header />
            <main className="main">
              <Routes>
                <Route path="/" element={<MemberListPage />} />
                <Route path="/members/:id" element={<MemberDetailPage />} />
                <Route path="/analytics" element={<AnalyticsLayout />}>
                  <Route index element={<AnalyticsHomePage />} />
                  <Route
                    path="professions"
                    element={<AnalyticsProfessionsPage />}
                  />
                  <Route
                    path="countries"
                    element={<AnalyticsCountriesPage />}
                  />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
