/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { Router } from 'itty-router';
import type { Context, Route } from './types';

import Helix from './routes/helix';
import Content from './routes/content';
import { AuthAPI, AuthUI, needsAuth } from './routes/auth';

const router = Router<Request>();

const fallback: Route = () => {
  return new Response('Not found', { status: 404 });
};

router
  .post('/api/auth/*', AuthAPI)
  .get('/auth/*', AuthUI)
  .get('/+(nav|footer).plain.html', Helix)
  .get('/content/dam/*', needsAuth, Content)
  .get('/*.+(png|svg|jpg|jpeg|css|js|woff2)', Helix)
  .get('/*', needsAuth, Content)
  .all('/*', fallback);

export default (request: Request, ctx: Context) => router.handle(request, ctx) as Promise<Response>;
