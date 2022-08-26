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

import type { Route, Context } from '../types';

export function isAuthenticated(request: Request, ctx: Context): boolean {
  const { env } = ctx;

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const spl = authHeader.split(' ');
    const scheme = spl.shift();
    if (scheme && (scheme.toLowerCase() === 'basic' || scheme.toLowerCase() === 'key')) {
      const key = spl.join(' ');
      if (key === env.UI_PASSWORD) {
        return true;
      }
    }
  }

  const cookieStr = request.headers.get('cookie');
  if (!cookieStr) {
    return false;
  }

  const cookies = cookieStr.split(';').map((s) => s.trim());

  const obj: Record<string, string> = {};
  cookies.forEach((c) => {
    const [key, val] = c.split('=');
    obj[key] = val;
  });

  if (!obj.auth_key || obj.auth_key !== env.UI_PASSWORD) {
    return false;
  }
  return true;
}

export function unauthenticatedTemplate() {
  return /* html */`<!DOCTYPE html>
<html>
  <head>
    <script>
      function getKey(){
        return prompt('Please enter your password:', '');
      }
      async function auth(){
        let key;
        let retry = true;
        while(!key && retry) {
          key = getKey();
          if(!key) {
            retry = window.confirm('Invalid password, try again?');
          }
        }

        if(key) {
          await fetch('/auth', { 
            method: 'POST', 
            body: JSON.stringify({ key }) 
          });
          window.navigation.reload();
        }
      }
    </script>
  </head>
  <body onload="auth()">
</html>`;
}

export function unauthenticatedResponse() {
  return new Response(unauthenticatedTemplate(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
}
const Auth: Route = async (request, ctx) => {
  const { env, log } = ctx;
  const json: Record<string, string> = await request.json();
  const { auth_key: key } = json;
  if (!key || key.trim() !== env.UI_PASSWORD) {
    log.warn('Not authorized: ', key);
    return new Response('Not authorized', { status: 401 });
  }
  return new Response('Ok', { headers: { 'set-cookie': `auth_key=${key}` } });
};

export default Auth;
