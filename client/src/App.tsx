import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from '@/pages/LandingPage';
import ApplicantHome from '@/pages/ApplicantHome';
import EmployeeHome from '@/pages/EmployeeHome';
import ManagerPortal from '@/pages/ManagerPortal';
import AgencyPortal from '@/pages/AgencyPortal';
import UploadCV from '@/pages/UploadCV';
import CandidatePass from '@/pages/CandidatePass';
import EmployeePass from '@/pages/EmployeePass';
import ManagerPass from '@/pages/ManagerPass';
import AgencyPass from '@/pages/AgencyPass';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import HRDashboard from '@/pages/HRDashboard';

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/applicants" component={ApplicantHome} />
        <Route path="/employees" component={EmployeeHome} />
        <Route path="/managers" component={ManagerPortal} />
        <Route path="/agencies" component={AgencyPortal} />
        <Route path="/upload-cv" component={UploadCV} />
        <Route path="/candidate-pass/:id" component={CandidatePass} />
        <Route path="/employee-pass/:id" component={EmployeePass} />
        <Route path="/manager-pass/:id" component={ManagerPass} />
        <Route path="/agency-pass/:id" component={AgencyPass} />
        <Route path="/hr/dashboard" component={HRDashboard} />
        <Route>404 - Page Not Found</Route>
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
