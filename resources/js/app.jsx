import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
    resolve: async (name) => {
        const page = await pages[`./Pages/${name}.jsx`]();
        return page.default ? page : { default: page };
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
