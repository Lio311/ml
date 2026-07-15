async function test() {
    const emailModule = await import('./app/lib/email.js');
    console.log("From import:", Object.keys(emailModule));
    
    // In Next.js, require might work differently, but let's check basic Node interop
    // const emailModuleReq = require('./app/lib/email.js');
    // console.log("From require:", Object.keys(emailModuleReq));
}
test();
