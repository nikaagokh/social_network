import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import indexRoutes from './src/routes/index.mjs'
import cookieParser from 'cookie-parser';
import eventEmitter from './emitter.js';
import { configureHbs } from './src/views/configure-hbs.js';
import { configureIO} from './src/gateway/chat.mjs';
import { ErrorHandler } from './src/utils/index.mjs';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

configureHbs();
const app = express();
configureIO(app);

app.use('/public', express.static(path.resolve(__dirname, "public")));
app.use('/files', express.static(path.resolve(__dirname, "files")));
app.set("views", path.join(__dirname, "src", "views"));
app.set("view engine", "hbs");
app.use(cookieParser());
app.use(express.json());
app.use(indexRoutes);
app.use(ErrorHandler)

