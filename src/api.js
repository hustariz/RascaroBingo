import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  register(userData) {
    return api.post('/users/register', userData);
  },
  login(userData) {
    return api.post('/users/login', userData);
  }
};