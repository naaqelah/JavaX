
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import PlaceholderPage from "./pages/PlaceholderPage";

import MarketingPerformance from "./pages/MarketingPerformance";
import Overview from "./pages/Overview";
import SocialMedia from "./pages/SocialMedia";
import TeamScorecards from "./pages/TeamScorecards";

import Projects from "./pages/Projects";
import ContentCalendar from "./pages/ContentCalendar";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectDetail from "./pages/ProjectDetail";

import MyWork from "./pages/MyWork";
import ReviewDetail from "./pages/ReviewDetail";

import Inventory from "./pages/Inventory";
import InventoryCreate from "./pages/InventoryCreate";
import Promotors from "./pages/Promotors";
import PromoterDetail from "./pages/PromoterDetail";

const routes = [
  "/my-work",
  "/my-work/review/:id",
  "/overview",
  "/marketing-performance",
  "/social-media",
  "/content-calendar",
  "/projects",
  "/projects/create",
  "/projects/:id",
  "/inventory",
  "/inventory/create",
  "/promotors",
  "/promotors/:id",
  "/ai-assistant",
  "/agent-office",
  "/integrations",
  "/team-scorecards",
];

function getPage(path) {
  switch (path) {
    case "/my-work":
      return <MyWork />;

    case "/my-work/review/:id":
      return <ReviewDetail />;

    case "/overview":
      return <Overview />;

    case "/marketing-performance":
      return <MarketingPerformance />;

    case "/social-media":
      return <SocialMedia />;

    case "/content-calendar":
      return <ContentCalendar />;

    case "/projects":
      return <Projects />;

    case "/projects/create":
      return <ProjectCreate />;

    case "/projects/:id":
      return <ProjectDetail />;

    case "/team-scorecards":
      return <TeamScorecards />;

    case "/inventory":
      return <Inventory />;

    case "/inventory/create":
      return <InventoryCreate />;

    case "/promotors":
      return <Promotors />;

    case "/promotors/:id":
      return <PromoterDetail />;

    case "/ai-assistant":
    case "/agent-office":
    case "/integrations":
      return <PlaceholderPage />;

    default:
      return <PlaceholderPage />;
  }
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={<Navigate to="/my-work" replace />}
          />

          {routes.map((path) => (
            <Route
              key={path}
              path={path}
              element={getPage(path)}
            />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
