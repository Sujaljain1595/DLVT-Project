export const VIZ_REGISTRY = [
  { id: 'neural-network',      label: 'Neural Network',         tags: ['neural network','nn','perceptron','feedforward','mlp'] },
  { id: 'backpropagation',     label: 'Backpropagation',        tags: ['backprop','backpropagation','gradient flow','chain rule'] },
  { id: 'gradient-descent',    label: 'Gradient Descent',       tags: ['gradient descent','optimizer','sgd','optimization','learning rate'] },
  { id: 'cnn',                 label: 'CNN Layers',             tags: ['cnn','convolutional','convolution','feature map','pooling'] },
  { id: 'loss-curve',          label: 'Loss Curve',             tags: ['loss','training loss','validation loss','convergence','epoch'] },
  { id: 'activation',          label: 'Activation Functions',   tags: ['activation','relu','sigmoid','tanh','softmax','gelu'] },
  { id: 'attention',           label: 'Self-Attention',         tags: ['attention','self-attention','transformer','query key value','qkv'] },
  { id: 'rnn',                 label: 'RNN / LSTM',             tags: ['rnn','lstm','gru','recurrent','sequence','vanishing gradient'] },
  { id: 'dropout',             label: 'Dropout Regularization', tags: ['dropout','regularization','overfitting','generalization'] },
  { id: 'batch-norm',          label: 'Batch Normalization',    tags: ['batch norm','batch normalization','normalization','layer norm'] },
  { id: 'embedding',           label: 'Word Embeddings',        tags: ['embedding','word2vec','word embedding','vector space','semantic'] },
  { id: 'autoencoder',         label: 'Autoencoder',            tags: ['autoencoder','encoder','decoder','latent space','reconstruction'] },
  { id: 'gan',                 label: 'GAN Training',           tags: ['gan','generative adversarial','generator','discriminator'] },
  { id: 'softmax',             label: 'Softmax & Cross-Entropy',tags: ['softmax','cross entropy','classification','probability','logits'] },
  { id: 'learning-rate',       label: 'Learning Rate Schedules',tags: ['learning rate schedule','cosine annealing','warmup','lr decay'] },
]

export function searchViz(query) {
  if (!query.trim()) return VIZ_REGISTRY
  const q = query.toLowerCase()
  return VIZ_REGISTRY.filter(v =>
    v.label.toLowerCase().includes(q) ||
    v.tags.some(t => t.includes(q))
  )
}
