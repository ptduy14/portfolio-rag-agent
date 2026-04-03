const corsOptions = {
  origin: [
    'http://localhost:3000',     
    'https://duypt14.is-a.dev/'
  ],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

export default corsOptions;