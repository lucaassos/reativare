function initializeAppLogic(user) {
    if (!user) return; // Segurança extra

    const path = window.location.pathname;
    if (path.endsWith('dashboard.html')) {
        initDashboard();
    } else if (path.endsWith('treino.html')) {
        initTreinoPage();
    } else if (path.endsWith('exercicios.html')) {
        initExerciciosPage();
    } else if (path.endsWith('perfil.html')) {
        initPerfilPage();
    }
}

// --- LÓGICA DO DASHBOARD ---
function initDashboard() {
    const clientList = document.getElementById('client-list');
    const modal = document.getElementById('client-modal');
    const addClientButton = document.getElementById('add-client-button');
    const closeButton = document.querySelector('.close-button');
    const addClientForm = document.getElementById('add-client-form');
    const searchBar = document.getElementById('search-bar');

    let allClients = [];

    addClientButton.onclick = () => modal.style.display = 'block';
    closeButton.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    addClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientData = {
            nome: document.getElementById('client-name').value,
            objetivo: document.getElementById('client-objective').value,
            tipo: document.getElementById('client-type').value,
            queixas: document.getElementById('client-complaints').value,
            diagnostico: document.getElementById('client-diagnosis').value,
            observacoes: document.getElementById('client-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('clientes').add(clientData).then(() => {
            modal.style.display = 'none';
            addClientForm.reset();
        }).catch(error => console.error("Erro ao adicionar cliente:", error));
    });

    db.collection('clientes').orderBy('nome').onSnapshot(snapshot => {
        allClients = [];
        snapshot.forEach(doc => {
            allClients.push({ id: doc.id, ...doc.data() });
        });
        renderClients(allClients);
    });

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredClients = allClients.filter(client => {
            return client.nome.toLowerCase().includes(searchTerm);
        });
        renderClients(filteredClients);
    });

    function renderClients(clients) {
        clientList.innerHTML = '';
        if (clients.length === 0) {
            clientList.innerHTML = `<p style="text-align: center;">Nenhum cliente encontrado.</p>`;
            return;
        }
        clients.forEach(client => {
            const card = `
                <div class="client-card">
                    <div class="info">
                        <h3>${client.nome}</h3>
                        <p><strong>Atendimento:</strong> ${client.tipo || 'Não definido'}</p>
                        <p>${client.objetivo}</p>
                    </div>
                    <div class="actions">
                        <a href="perfil.html?id=${client.id}" class="btn btn-secondary">Ver Perfil</a>
                        <a href="treino.html?id=${client.id}" class="btn btn-outline">Ver Treino</a>
                    </div>
                </div>
            `;
            clientList.innerHTML += card;
        });
    }
}


// --- LÓGICA DA PÁGINA DE PERFIL ---
function initPerfilPage() {
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');
    if (!clienteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const profileHeader = document.getElementById('client-profile-header');
    const profileForm = document.getElementById('profile-form');
    const nameInput = document.getElementById('profile-name');
    const objectiveInput = document.getElementById('profile-objective');
    const typeInput = document.getElementById('profile-type');
    const complaintsInput = document.getElementById('profile-complaints');
    const diagnosisInput = document.getElementById('profile-diagnosis');
    const notesInput = document.getElementById('profile-notes');
    const successMessage = document.getElementById('success-message');
    const deleteButton = document.getElementById('delete-client-button');

    db.collection('clientes').doc(clienteId).get().then(doc => {
        if (doc.exists) {
            const client = doc.data();
            profileHeader.innerHTML = `<h2>Perfil de ${client.nome}</h2>`;
            nameInput.value = client.nome;
            objectiveInput.value = client.objetivo;
            typeInput.value = client.tipo || 'Academia terapêutica';
            complaintsInput.value = client.queixas || '';
            diagnosisInput.value = client.diagnostico || '';
            notesInput.value = client.observacoes || '';
        } else {
            alert('Cliente não encontrado!');
            window.location.href = 'dashboard.html';
        }
    });

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updatedData = {
            nome: nameInput.value,
            objetivo: objectiveInput.value,
            tipo: typeInput.value,
            queixas: complaintsInput.value,
            diagnostico: diagnosisInput.value,
            observacoes: notesInput.value
        };
        db.collection('clientes').doc(clienteId).update(updatedData)
            .then(() => {
                profileHeader.innerHTML = `<h2>Perfil de ${updatedData.nome}</h2>`;
                successMessage.textContent = 'Perfil atualizado com sucesso!';
                successMessage.style.opacity = 1;
                setTimeout(() => {
                    successMessage.style.opacity = 0;
                }, 3000);
            })
            .catch(error => {
                console.error("Erro ao atualizar perfil:", error);
                alert("Ocorreu um erro ao salvar. Tente novamente.");
            });
    });

    deleteButton.addEventListener('click', () => {
        const clientName = nameInput.value;
        if (confirm(`ATENÇÃO: Você está prestes a excluir permanentemente o cliente "${clientName}".\n\nTodos os dados, incluindo os treinos, serão perdidos.\n\nDeseja continuar?`)) {
            db.collection('clientes').doc(clienteId).delete()
                .then(() => {
                    alert(`Cliente "${clientName}" excluído com sucesso.`);
                    window.location.href = 'dashboard.html';
                })
                .catch(error => {
                    console.error("Erro ao excluir cliente:", error);
                    alert("Ocorreu um erro ao excluir o cliente.");
                });
        }
    });
}

// --- LÓGICA DA PÁGINA DE BIBLIOTECA DE EXERCÍCIOS ---
function initExerciciosPage() {
    const form = document.getElementById('add-base-exercise-form');
    const exerciseListDiv = document.getElementById('base-exercise-list');

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('base-exercise-name').value;
        const grupo = document.getElementById('base-exercise-group').value;
        const tipo = document.getElementById('base-exercise-type').value;

        db.collection('exercicios_base').add({
            nome: nome,
            grupoMuscular: grupo,
            tipo: tipo,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            form.reset();
        }).catch(error => console.error("Erro ao salvar exercício:", error));
    });

    db.collection('exercicios_base').orderBy('nome').onSnapshot(snapshot => {
        if (snapshot.empty) {
            exerciseListDiv.innerHTML = "<p>Nenhum exercício na biblioteca.</p>";
            return;
        }
        let html = '<table><thead><tr><th>Exercício</th><th>Grupo Muscular</th><th>Tipo</th><th>Ação</th></tr></thead><tbody>';
        snapshot.forEach(doc => {
            const ex = doc.data();
            html += `
                <tr>
                    <td>${ex.nome}</td>
                    <td>${ex.grupoMuscular}</td>
                    <td>${ex.tipo === 'time' ? 'Tempo' : 'Repetições'}</td>
                    <td><button class="btn btn-danger btn-sm" onclick="deleteBaseExercise('${doc.id}')">Excluir</button></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        exerciseListDiv.innerHTML = html;
    });
}

function deleteBaseExercise(id) {
    if (confirm('Tem certeza que deseja excluir este exercício da biblioteca?')) {
        db.collection('exercicios_base').doc(id).delete();
    }
}

// --- LÓGICA DA PÁGINA DE TREINO ---
function initTreinoPage() {
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');
    if (!clienteId) {
        window.location.href = 'dashboard.html';
        return;
    }

    const clientHeader = document.getElementById('client-header');
    const tabs = document.querySelectorAll('.tab-link');
    const workoutContent = document.getElementById('workout-content');
    const dayTemplate = document.getElementById('day-template');
    let baseExercises = [];

    db.collection('clientes').doc(clienteId).get().then(doc => {
        if (doc.exists) {
            const client = doc.data();
            clientHeader.innerHTML = `
                <h2>${client.nome}</h2>
                <p><strong>Objetivo:</strong> ${client.objetivo}</p>
                <p><strong>Observações:</strong> ${client.observacoes || 'Nenhuma observação.'}</p>
            `;
        } else {
            console.error("Cliente não encontrado!");
        }
    });

    db.collection('exercicios_base').orderBy('nome').get().then(snapshot => {
        snapshot.forEach(doc => {
            baseExercises.push({ id: doc.id, ...doc.data() });
        });

        const dayMap = ['segunda', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'segunda'];
        const todayIndex = new Date().getDay();
        const todayName = dayMap[todayIndex];

        const todayTab = document.querySelector(`.tab-link[data-day="${todayName}"]`);
        if (todayTab) {
            todayTab.classList.add('active');
        } else {
            document.querySelector('.tab-link[data-day="segunda"]').classList.add('active');
        }
        
        loadContentForDay(todayName);
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const dayId = tab.getAttribute('data-day');
            loadContentForDay(dayId);
        });
    });

    function loadContentForDay(dayId) {
        workoutContent.innerHTML = '';
        const templateNode = dayTemplate.content.cloneNode(true);
        workoutContent.appendChild(templateNode);
        
        // --- LÓGICA DA EVOLUÇÃO ---
        const evolutionForm = workoutContent.querySelector('.evolution-form');
        const evolutionListDiv = workoutContent.querySelector('.evolution-list');

        evolutionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const evolutionData = {
                pa: evolutionForm.querySelector('.evolution-pa').value,
                fc: evolutionForm.querySelector('.evolution-fc').value,
                spo2: evolutionForm.querySelector('.evolution-spo2').value,
                notas: evolutionForm.querySelector('.evolution-notes').value,
                data: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            if (!evolutionData.notas && !evolutionData.pa && !evolutionData.fc && !evolutionData.spo2) {
                alert('Preencha pelo menos um campo da evolução.');
                return;
            }

            db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId)
              .collection('evolucoes').add(evolutionData)
              .then(() => {
                  evolutionForm.reset();
              }).catch(error => console.error("Erro ao salvar evolução:", error));
        });

        db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId)
          .collection('evolucoes').orderBy('data', 'desc').onSnapshot(snapshot => {
            evolutionListDiv.innerHTML = '';
            if (snapshot.empty) {
                evolutionListDiv.innerHTML = '<p>Nenhum registro de evolução para este dia.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const evo = doc.data();
                const dataFormatada = evo.data ? evo.data.toDate().toLocaleDateString('pt-BR') : 'Data indisponível';
                const evolutionCard = `
                    <div class="card-section" style="margin-bottom: 1rem; background-color: #2a2a2a;">
                        <p><strong>Data:</strong> ${dataFormatada}</p>
                        <p><strong>PA:</strong> ${evo.pa || '-'} | <strong>FC:</strong> ${evo.fc || '-'} | <strong>SpO2:</strong> ${evo.spo2 || '-'}</p>
                        <p><strong>Notas:</strong> ${evo.notas || 'Nenhuma.'}</p>
                    </div>
                `;
                evolutionListDiv.innerHTML += evolutionCard;
            });
        });

        // --- LÓGICA DOS EXERCÍCIOS ---
        const exerciseSelect = workoutContent.querySelector('#exercise-select');
        const selectedExerciseIdInput = workoutContent.querySelector('#selected-exercise-id');
        const selectedExerciseNameInput = workoutContent.querySelector('#selected-exercise-name');
        const selectedExerciseTypeInput = workoutContent.querySelector('#selected-exercise-type');
        
        // Preenche o dropdown com os exercícios
        baseExercises.forEach(ex => {
            const option = document.createElement('option');
            option.value = ex.id;
            option.textContent = ex.nome;
            option.dataset.type = ex.tipo || 'reps';
            exerciseSelect.appendChild(option);
        });

        // Evento de mudança no dropdown
        exerciseSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const exerciseId = selectedOption.value;
            const exerciseType = selectedOption.dataset.type;

            selectedExerciseIdInput.value = exerciseId;
            selectedExerciseNameInput.value = selectedOption.textContent;
            selectedExerciseTypeInput.value = exerciseType;

            const repsFields = workoutContent.querySelector('.reps-fields');
            const timeFields = workoutContent.querySelector('.time-fields');

            if (exerciseId === "") { // Se a opção "Escolha um exercício" for selecionada
                 repsFields.style.display = 'none';
                 timeFields.style.display = 'none';
            } else if (exerciseType === 'time') {
                repsFields.style.display = 'none';
                timeFields.style.display = 'grid';
            } else {
                repsFields.style.display = 'grid';
                timeFields.style.display = 'none';
            }
        });
    
        const exerciseListDiv = workoutContent.querySelector('.exercise-list');
        const addExerciseForm = workoutContent.querySelector('.add-exercise-form');
    
        addExerciseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const exerciseBaseId = selectedExerciseIdInput.value;
            
            if (!exerciseBaseId) {
                alert("Por favor, selecione um exercício da lista.");
                return;
            }
            
            const exerciseName = selectedExerciseNameInput.value;
            const exerciseType = selectedExerciseTypeInput.value;
            
            let exerciseData = {
                exercicioBaseId: exerciseBaseId,
                nomeExercicio: exerciseName,
                tipo: exerciseType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (exerciseType === 'time') {
                exerciseData.duracao = addExerciseForm.querySelector('.exercise-duration').value;
                exerciseData.intensidade = addExerciseForm.querySelector('.exercise-intensity').value;
            } else {
                exerciseData.series = addExerciseForm.querySelector('.exercise-series').value;
                exerciseData.repeticoes = addExerciseForm.querySelector('.exercise-reps').value;
                exerciseData.carga = addExerciseForm.querySelector('.exercise-load').value;
            }

            db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId).collection('exercicios').add(exerciseData)
                .then(() => {
                    addExerciseForm.reset();
                    exerciseSelect.value = ""; // Reseta o dropdown
                    workoutContent.querySelector('.reps-fields').style.display = 'none';
                    workoutContent.querySelector('.time-fields').style.display = 'none';
                })
                .catch(error => console.error(`Erro ao adicionar exercício em ${dayId}:`, error));
        });
    
        db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId).collection('exercicios').orderBy('createdAt').onSnapshot(snapshot => {
            if (snapshot.empty) {
                exerciseListDiv.innerHTML = "<p>Nenhum exercício cadastrado para este dia.</p>";
                return;
            }
            let tableHTML = `<table><thead><tr><th>Exercício</th><th>Detalhe 1</th><th>Detalhe 2</th><th>Detalhe 3</th><th>Ação</th></tr></thead><tbody>`;
            snapshot.forEach(doc => {
                const ex = doc.data();
                
                let detailsHTML = '';
                if (ex.tipo === 'time') {
                    detailsHTML = `
                        <td><strong>Duração:</strong> ${ex.duracao || '-'}</td>
                        <td><strong>Intensidade:</strong> ${ex.intensidade || '-'}</td>
                        <td></td>
                    `;
                } else {
                    detailsHTML = `
                        <td><strong>Séries:</strong> ${ex.series || '-'}</td>
                        <td><strong>Repetições:</strong> ${ex.repeticoes || '-'}</td>
                        <td><strong>Carga:</strong> ${ex.carga || '-'}</td>
                    `;
                }
                
                tableHTML += `
                    <tr>
                        <td>${ex.nomeExercicio}</td>
                        ${detailsHTML}
                        <td><button class="btn btn-danger btn-sm" data-id="${doc.id}">Excluir</button></td>
                    </tr>
                `;
            });
            tableHTML += '</tbody></table>';
            exerciseListDiv.innerHTML = tableHTML;
    
            exerciseListDiv.querySelectorAll('.btn-danger').forEach(button => {
                button.addEventListener('click', (e) => {
                    const exerciseId = e.target.getAttribute('data-id');
                    db.collection('clientes').doc(clienteId).collection('treinos').doc(dayId).collection('exercicios').doc(exerciseId).delete();
                });
            });
        });
    }
}
