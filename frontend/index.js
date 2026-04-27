const API = "https://university-2-3230.onrender.com";
let currentEmail = "";
let countdownInterval = null;

// ─── UTILIDADES ───────────────────────────────────────────────

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `msg ${type} show`;
}

function hideMsg(id) {
    document.getElementById(id).className = 'msg';
}

function setLoading(btnId, loading, text) {
    const btn = document.getElementById(btnId);
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="spinner"></span>${text}` : text;
}

// ─── VISTA 1: ENVIAR OTP ──────────────────────────────────────

function sendOTP() {
    const email = document.getElementById('input-email').value.trim();
    const errEl = document.getElementById('err-email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validación
    if (!email || !emailRegex.test(email)) {
        document.getElementById('input-email').classList.add('error-input');
        errEl.classList.add('show');
        return;
    }
    document.getElementById('input-email').classList.remove('error-input');
    errEl.classList.remove('show');

    setLoading('btn-send', true, 'Enviando...');
    hideMsg('msg-email');

    fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(r => r.json().then(data => ({ ok: r.ok, data })))
    .then(({ ok, data }) => {
        setLoading('btn-send', false, 'Enviar código OTP');
        if (ok) {
            currentEmail = email;
            document.getElementById('display-email').textContent = email;
            clearOTPFields();
            showView('view-otp');
            startCountdown();
        } else {
            showMsg('msg-email', data.detail || 'Error al enviar el correo.', 'error');
        }
    })
    .catch(() => {
        setLoading('btn-send', false, 'Enviar código OTP');
        showMsg('msg-email', 'No se pudo conectar con el servidor.', 'error');
    });
}

// Enter en campo email
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('input-email').addEventListener('keydown', e => {
        if (e.key === 'Enter') sendOTP();
    });
});

// ─── OTP DIGITS ───────────────────────────────────────────────

function otpInput(i) {
    const val = document.getElementById(`d${i}`).value;
    // Solo permitir números
    document.getElementById(`d${i}`).value = val.replace(/\D/, '');
    if (val && i < 5) document.getElementById(`d${i + 1}`).focus();
    // Limpiar error al escribir
    document.getElementById('err-otp').classList.remove('show');
    document.querySelectorAll('.otp-digit').forEach(d => d.classList.remove('error-input'));
}

function otpKey(e, i) {
    if (e.key === 'Backspace' && !document.getElementById(`d${i}`).value && i > 0) {
        document.getElementById(`d${i - 1}`).focus();
    }
}

function getOTPCode() {
    let code = '';
    for (let i = 0; i < 6; i++) code += document.getElementById(`d${i}`).value;
    return code;
}

function clearOTPFields() {
    for (let i = 0; i < 6; i++) document.getElementById(`d${i}`).value = '';
}

// ─── VISTA 2: VERIFICAR OTP ───────────────────────────────────

function verifyOTP() {
    const code = getOTPCode();
    const errEl = document.getElementById('err-otp');

    // Validación: código debe tener exactamente 6 dígitos
    if (code.length < 6 || !/^\d{6}$/.test(code)) {
        document.querySelectorAll('.otp-digit').forEach(d => d.classList.add('error-input'));
        errEl.classList.add('show');
        return;
    }
    errEl.classList.remove('show');
    document.querySelectorAll('.otp-digit').forEach(d => d.classList.remove('error-input'));

    setLoading('btn-verify', true, 'Verificando...');
    hideMsg('msg-otp');

    fetch(`${API}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, code })
    })
    .then(r => r.json().then(data => ({ ok: r.ok, data })))
    .then(({ ok, data }) => {
        setLoading('btn-verify', false, 'Verificar código');
        if (ok && data.authenticated) {
            clearInterval(countdownInterval);
            showView('view-crud');
            loadStudents();
        } else {
            showMsg('msg-otp', 'Código incorrecto. Verifica e intenta de nuevo.', 'error');
            clearOTPFields();
            document.getElementById('d0').focus();
        }
    })
    .catch(() => {
        setLoading('btn-verify', false, 'Verificar código');
        showMsg('msg-otp', 'No se pudo conectar con el servidor.', 'error');
    });
}

// ─── COUNTDOWN ────────────────────────────────────────────────

function startCountdown() {
    let secs = 60;
    document.getElementById('countdown').textContent = secs;
    document.getElementById('timer-text').style.display = 'inline';
    document.getElementById('resend-link').style.display = 'none';

    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        secs--;
        document.getElementById('countdown').textContent = secs;
        if (secs <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('timer-text').style.display = 'none';
            document.getElementById('resend-link').style.display = 'inline';
        }
    }, 1000);
}

function resendOTP(e) {
    e.preventDefault();
    hideMsg('msg-otp');

    fetch(`${API}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail })
    })
    .then(r => r.json().then(data => ({ ok: r.ok, data })))
    .then(({ ok }) => {
        if (ok) {
            clearOTPFields();
            startCountdown();
            showMsg('msg-otp', 'Código reenviado correctamente.', 'success');
        }
    });
}

function goBack() {
    clearInterval(countdownInterval);
    hideMsg('msg-otp');
    showView('view-email');
}

// ─── CRUD ─────────────────────────────────────────────────────

function loadStudents() {
    fetch(`${API}/students/`)
        .then(r => r.json())
        .then(data => renderTable(data))
        .catch(() => {
            document.getElementById('student-list').innerHTML =
                '<tr><td colspan="5" class="empty-state">Error al cargar estudiantes.</td></tr>';
        });
}

function renderTable(students) {
    const tbody = document.getElementById('student-list');
    if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No hay estudiantes registrados.</td></tr>';
        return;
    }
    tbody.innerHTML = students.map(s => {
        const g = parseFloat(s.grade);
        const cls = g >= 4 ? 'grade-high' : g >= 3 ? 'grade-mid' : 'grade-low';
        return `<tr>
            <td>${s.id}</td>
            <td>${s.name}</td>
            <td>${s.age}</td>
            <td><span class="grade-badge ${cls}">${g.toFixed(1)}</span></td>
            <td>
                <button class="action-btn action-edit" onclick="editStudent(${s.id},'${s.name}',${s.age},${s.grade})">Editar</button>
                <button class="action-btn action-delete" onclick="deleteStudent(${s.id})">Eliminar</button>
            </td>
        </tr>`;
    }).join('');
}

function saveStudent() {
    const id    = document.getElementById('student-id').value;
    const name  = document.getElementById('name').value.trim();
    const age   = parseInt(document.getElementById('age').value);
    const grade = parseFloat(document.getElementById('grade').value);

    if (!name || name.length < 2 || !age || isNaN(grade)) {
        showMsg('msg-crud', 'Completa todos los campos correctamente.', 'error');
        return;
    }

    hideMsg('msg-crud');
    const method = id ? 'PUT' : 'POST';
    const url    = id ? `${API}/students/${id}` : `${API}/students/`;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, grade })
    })
    .then(r => r.json().then(data => ({ ok: r.ok, data })))
    .then(({ ok, data }) => {
        if (ok) {
            showMsg('msg-crud', id ? 'Estudiante actualizado.' : 'Estudiante creado.', 'success');
            cancelEdit();
            loadStudents();
        } else {
            showMsg('msg-crud', data.detail || 'Error al guardar.', 'error');
        }
    });
}

function editStudent(id, name, age, grade) {
    document.getElementById('student-id').value  = id;
    document.getElementById('name').value         = name;
    document.getElementById('age').value          = age;
    document.getElementById('grade').value        = grade;
    document.getElementById('form-title').textContent    = `Editando estudiante #${id}`;
    document.getElementById('submit-btn').textContent    = 'Actualizar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    document.getElementById('student-id').value       = '';
    document.getElementById('name').value              = '';
    document.getElementById('age').value               = '';
    document.getElementById('grade').value             = '';
    document.getElementById('form-title').textContent  = 'Nuevo Estudiante';
    document.getElementById('submit-btn').textContent  = 'Guardar';
}

function deleteStudent(id) {
    if (!confirm(`¿Eliminar estudiante #${id}?`)) return;
    fetch(`${API}/students/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(() => {
            showMsg('msg-crud', 'Estudiante eliminado.', 'success');
            loadStudents();
        });
}
