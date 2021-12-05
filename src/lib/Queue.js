import Bee from 'bee-queue'

import CancelationMail from '../app/jobs/CancellationMail'

import redisConfig from '../config/redis'

const jobs = [CancelationMail]

class Queue {
  constructor() {
    // Cada job tem sua própria fila.
    this.queues = {} // Objeto que armazenará todas as filas.

    this.init() // Inicialização das filas.
  }

  init() {
    // Desestruturação ↓↓ pega so´a key* e o método handle*.
    jobs.forEach(({ key, handle }) => {
      // Ou job / job.key and job.handle.
      this.queues[key] = {
        // A chave será a key do job.
        bee: new Bee(key, {
          // O Valor será um objeto.
          redis: redisConfig,
        }),
        handle,
      }
    })
  }

  // Adiciona novos jobs dentro de cada fila, recebe a fila e o job.
  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save()
    // Adiciona a fila no objeto de filas, acessa a propriedade bee, do objeto, cria a fila com método createJob*, salva com o método save()*
  }

  processQueue() {
    // Processa as filas.
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key]

      bee.on('failed', this.handleFailure).process(handle)
    })
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err)
    // job.queue.name = key
  }
}

export default new Queue()
