import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AIChatBot from "./components/AIChatBot";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingTracking from "./pages/BookingTracking";
import Contact from "./pages/Contact";
import News from "./pages/News";
import Login from "./pages/Login";
import BookingDetail from "./pages/admin/BookingDetail";
import Facilities from "./pages/Facilities";
import NewsDetail from "./pages/NewsDetail";
import Location from "./pages/Location";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Transportation from "./pages/Transportation";
import TermsOfService from "./pages/TermsOfService";
import CancelBooking from "./pages/CancelBooking";

import { ReconciliationReport } from "./pages/ReconciliationReport";

function Router() {
  return (
    <>
      <Navbar />
      <div className="pt-20">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/rooms" component={Rooms} />
          <Route path="/rooms/:id" component={RoomDetail} />
          <Route path="/booking" component={Booking} />
          <Route path="/booking/confirmation" component={BookingConfirmation} />
          <Route path="/booking/confirmation/:id" component={BookingConfirmation} />
          <Route path="/booking-tracking" component={BookingTracking} />
          <Route path="/contact" component={Contact} />
          <Route path="/news" component={News} />
          <Route path="/news/:id" component={NewsDetail} />
          <Route path="/facilities" component={Facilities} />
          <Route path="/location" component={Location} />
          <Route path="/admin" component={Admin} />

          <Route path="/admin/reconciliation" component={ReconciliationReport} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/transportation" component={Transportation} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/cancel-booking" component={CancelBooking} />
          <Route path="/404" component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer />
      <AIChatBot />
    </>
  );
}

function App() {
  return (
    <div data-version="final-debug-101">
      <div style={{ backgroundColor: 'red', color: 'white', padding: '5px', textAlign: 'center' }}>
        DEBUG: 核心版本 101 已載入
      </div>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
