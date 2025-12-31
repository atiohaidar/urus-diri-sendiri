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
    <div className="min-h-screen bg-background">
      {/* App Container - Mobile First */}
      <div className="max-w-md mx-auto min-h-screen bg-background relative shadow-2xl shadow-foreground/5">
        {/* Screen Content */}
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'parking' && <ParkingLotScreen />}
        {activeTab === 'history' && <HistoryScreen />}

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <Toaster />
    </div>
  );
};

export default Index;
