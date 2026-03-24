import { buildApp } from './core/app';
const app = buildApp();
app.ready().then(() => {
  console.log('--- ROUTES ---');
  console.log(app.printRoutes());
}).catch(console.error);
