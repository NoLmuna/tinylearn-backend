// eslint-disable-next-line no-undef
const fetch = require('node-fetch');

async function testGradeEndpoint() {
    try {
        console.log('\n=== Testing Grade Submission Endpoint ===\n');
        
        // First, login as teacher to get token
        console.log('1. Logging in as teacher...');
        const loginRes = await fetch('http://localhost:3000/api/teachers/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'teacher1',
                password: 'password123'
            })
        });
        
        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error('Login failed:', loginData.message);
            return;
        }
        
        const token = loginData.data.token;
        console.log('✅ Login successful');
        
        // Test the grade endpoint
        console.log('\n2. Testing grade submission endpoint...');
        const start = Date.now();
        
        const gradeRes = await fetch('http://localhost:3000/api/submissions/2/grade', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                score: 85,
                feedback: 'Test feedback from script'
            })
        });
        
        const elapsed = Date.now() - start;
        console.log(`⏱️  Request took: ${elapsed}ms`);
        
        const gradeData = await gradeRes.json();
        console.log('\nResponse:', JSON.stringify(gradeData, null, 2));
        
        if (gradeData.success) {
            console.log('\n✅ Grade submission SUCCESSFUL!');
        } else {
            console.log('\n❌ Grade submission FAILED:', gradeData.message);
        }
        
    } catch (error) {
        console.error('\n💥 Error:', error.message);
    }
}

testGradeEndpoint();
