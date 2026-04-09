const fs = require('fs');
const replaceInFile = (path, search, repl) => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    if (typeof search === 'string') content = content.replace(search, repl);
    else content = content.replace(search, repl);
    fs.writeFileSync(path, content);
  }
};
replaceInFile('src/pages/AdminRegister.jsx', /\} catch \(.*?\) \{/g, '} catch {');
replaceInFile('src/pages/BarberDashboard.jsx', /\} catch \(.*?\) \{/g, '} catch {');
replaceInFile('src/pages/BusinessRegister.jsx', /\} catch \(.*?\) \{/g, '} catch {');

// businessregister cleanups
let bReg = fs.readFileSync('src/pages/BusinessRegister.jsx', 'utf8');
bReg = bReg.replace(/const \[searchParams[^=]*= useSearchParams\(\);\n/g, '');
bReg = bReg.replace(/, useSearchParams/g, '');
fs.writeFileSync('src/pages/BusinessRegister.jsx', bReg);
