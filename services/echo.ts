import Echo from 'laravel-echo';
import Pusher from '@pusher/pusher-websocket-react-native';

const echo = new Echo({
  broadcaster: 'pusher',
  key: 'YOUR_PUSHER_APP_KEY',
  cluster: 'eu',
  forceTLS: true,
  authEndpoint: 'https://your-api.com/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${YOUR_AUTH_TOKEN}`,
    },
  },
});

export default echo;