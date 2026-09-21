import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getAuth,
} from "firebase-admin/auth";

import fs from "fs";
import path from "path";
import {
  fileURLToPath,
} from "url";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

// backend/config/firebase-service-account.json
const serviceAccountPath =
  path.resolve(
    __dirname,
    "../../config/firebase-service-account.json"
  );

console.log(
  "Firebase service account path:",
  serviceAccountPath
);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Firebase service account file not found at: ${serviceAccountPath}`
  );
}

const raw =
  fs.readFileSync(
    serviceAccountPath,
    "utf8"
  );

const serviceAccount =
  JSON.parse(raw);

// Safe debugging — do NOT print the actual private key.
console.log(
  "Firebase project:",
  serviceAccount.project_id
);

console.log(
  "Firebase client email:",
  serviceAccount.client_email
);

console.log(
  "Private key exists:",
  Boolean(serviceAccount.private_key)
);

console.log(
  "Private key starts correctly:",
  serviceAccount.private_key?.startsWith(
    "-----BEGIN PRIVATE KEY-----"
  )
);

console.log(
  "Private key ends correctly:",
  serviceAccount.private_key
    ?.trim()
    .endsWith(
      "-----END PRIVATE KEY-----"
    )
);

if (!serviceAccount.project_id) {
  throw new Error(
    "Firebase service account is missing project_id."
  );
}

if (!serviceAccount.client_email) {
  throw new Error(
    "Firebase service account is missing client_email."
  );
}

if (!serviceAccount.private_key) {
  throw new Error(
    "Firebase service account is missing private_key."
  );
}

if (
  !serviceAccount.private_key.startsWith(
    "-----BEGIN PRIVATE KEY-----"
  )
) {
  throw new Error(
    "Firebase private key does not have a valid BEGIN PRIVATE KEY header."
  );
}

if (
  !serviceAccount.private_key
    .trim()
    .endsWith(
      "-----END PRIVATE KEY-----"
    )
) {
  throw new Error(
    "Firebase private key does not have a valid END PRIVATE KEY footer."
  );
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:
        serviceAccount.project_id,

      clientEmail:
        serviceAccount.client_email,

      privateKey:
        serviceAccount.private_key,
    }),
  });
}

export const firebaseAuth =
  getAuth();