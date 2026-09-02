<?php

/*
|--------------------------------------------------------------------------
| Platform operator ("super admin") access
|--------------------------------------------------------------------------
|
| A single operator account that is completely separate from the `users`
| table — it has no store, no registration, and only ever signs in at
| `/super-admin/login`. Override either value from the environment in
| production; the defaults below are for local development.
|
| `password_hash` is a bcrypt hash. To rotate it:
|   php -r "echo password_hash('new-secret', PASSWORD_BCRYPT);"
| or set `SUPER_ADMIN_PASSWORD` to a plain string (checked first).
|
*/

return [
    'username' => env('SUPER_ADMIN_USERNAME', 'sasho-dev'),

    'password' => env('SUPER_ADMIN_PASSWORD'),

    'password_hash' => env(
        'SUPER_ADMIN_PASSWORD_HASH',
        '$2y$10$wCs7tmrTqXUrDWjlYPDFMeInFRem1a2hBebmwyD43l446QmqD/GDa',
    ),
];
