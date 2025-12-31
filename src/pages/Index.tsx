import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/components/screens/HomeScreen';
import ParkingLotScreen from '@/components/screens/ParkingLotScreen';
import HistoryScreen from '@/components/screens/HistoryScreen';
import { Toaster } from '@/components/ui/toaster';

type Tab = 'home' | 'parking' | 'history';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <div className="min-h-screen bg-background md:pl-64 transition-all duration-300">
      {/* Screen Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'parking' && <ParkingLotScreen />}
        {activeTab === 'history' && <HistoryScreen />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <Toaster />
    </div>
  );
};

export default Index;
