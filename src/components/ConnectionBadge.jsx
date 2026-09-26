import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionBadge = ({ connected }) => (
  <div className={`conn-badge ${connected ? 'conn-live' : 'conn-offline'}`}>
    {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
    {connected ? 'Live' : 'Reconnecting…'}
  </div>
);

export default ConnectionBadge;
