"use client"
import React, { useEffect, useState } from 'react';

const MyComponent = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket('wss://bdfanf7dt5afzkmnwoilipajym.appsync-realtime-api.us-east-1.amazonaws.com/graphql');

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: {
          headers: {
            'x-api-key': 'da2-n54uxp2e2veqflrpeejvtej6q4',
          },
        },
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received message:', data);
      setEvents((prev) => [...prev, data]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h1>Dummy Event Subscriptions</h1>
      <ul>
        {events.map((event, index) => (
          <li key={index}>{JSON.stringify(event)}</li>
        ))}
      </ul>
    </div>
  );
};

export default MyComponent;
