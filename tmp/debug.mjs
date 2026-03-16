import { clerkClient } from '@clerk/nextjs/server';

async function test() {
    try {
        const clerk = await clerkClient();
        console.log(Object.keys(clerk.users));
    } catch(e) { console.log(e); }
}
test();
