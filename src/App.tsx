import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import LabelScanner from '@/pages/LabelScanner';
import ViolationsMap from '@/pages/ViolationsMap';
import CitizenReports from '@/pages/CitizenReports';
import BrandScores from '@/pages/BrandScores';
import GenerateReport from '@/pages/GenerateReport';

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scanner" element={<LabelScanner />} />
          <Route path="/map" element={<ViolationsMap />} />
          <Route path="/reports" element={<CitizenReports />} />
          <Route path="/brands" element={<BrandScores />} />
          <Route path="/report-form" element={<GenerateReport />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
