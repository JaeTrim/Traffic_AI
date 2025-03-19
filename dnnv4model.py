# CS 4624 ML Script
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.model_selection import cross_val_score, KFold
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def build_and_compile_model(norm):
  model = keras.Sequential([
      norm,
      layers.Dense(64, activation='relu'),
      layers.Dense(64, activation='relu'),
      layers.Dense(1, activation='relu')
  ])
  model.compile(loss='mean_absolute_error', metrics=[keras.metrics.MeanSquaredError(),keras.metrics.MeanAbsoluteError()], optimizer=keras.optimizers.Adam(0.001))
  return model

def plot_loss(history):
  plt.clf()
  plt.plot(history.history['loss'], label='loss')
  plt.plot(history.history['val_loss'], label='val_loss')
  plt.ylim([0, 50])
  plt.xlim([0, 8])
  plt.xlabel('Epoch')
  plt.ylabel('Error (Crashes)')
  plt.legend()
  plt.grid(True)
  plt.title("Crash Prediction Model Training Loss")
  plt.tight_layout()

def test_predictions(test_labels, test_features, model_name):
  reloaded = tf.keras.models.load_model(model_name)
  test_predictions = reloaded.predict(np.log(test_features)).flatten()
  plt.clf()
  error = test_predictions - test_labels
  plt.clf
  plt.hist(error, bins=25)
  plt.xlabel('Prediction Error (Crashes)')
  _ = plt.ylabel('Count')
  plt.title("Prediction Error Distribution")
  plt.tight_layout()
  plt.savefig('error-dist-final.png')

  a = plt.axes(aspect='equal')
  plt.clf()
  plt.scatter(test_labels, test_predictions)
  plt.xlabel('True Value (Crashes)')
  plt.ylabel('Predicted Value (Crashes)')
  lims = [0,50]
  plt.xlim(lims)
  plt.ylim(lims)
  _ = plt.plot(lims, lims)
  plt.title("True Value vs. Predicted Value")
  plt.tight_layout()
  plt.savefig('true-predicted-final.png')

def pairplot(train_dataset):
  pplot = sns.pairplot(train_dataset[['Length', 'ADT', 'Crashes']], diag_kind='kde')
  pplot.savefig("raw-data-final.png")

def log_pairplot(train_dataset):
  train_transform = train_dataset.copy()
  train_transform['Log Length'] = np.log(train_transform['Length'])
  train_transform['Log ADT'] = np.log(train_transform['ADT'])
  del train_transform['Length']
  del train_transform['ADT']

  train_transform.corr().to_csv('train_transform_corr.csv')
  pplot_transform = sns.pairplot(train_transform, diag_kind='kde')
  pplot_transform.savefig("log-data-final.png")

def kfold(dataset):
  dataset.isna().sum() # Data cleaning
  kf = KFold(n_splits=5,shuffle=True, random_state=42) # Setting k-folds
  test_results = {}
  splits = []

  # K-Fold Cross Validation
  for i, (train_index, test_index) in enumerate(kf.split(dataset)):
    splits.append((train_index,test_index))
    dataset = raw_dataset.copy()
    train_dataset = dataset.drop(test_index) # 80-20 training-testing split
    test_dataset = dataset.drop(train_index)
    train_transform = train_dataset.copy()
    train_transform['Log Length'] = np.log(train_transform['Length'])
    train_transform['Log ADT'] = np.log(train_transform['ADT'])
    del train_transform['Length']
    del train_transform['ADT']
    train_dataset = train_transform
    train_features = train_dataset.copy()
    test_features = test_dataset.copy()
    train_labels = train_features.pop('Crashes')
    test_labels = test_features.pop('Crashes')

    normalizer = tf.keras.layers.Normalization(axis=-1)
    normalizer.adapt(np.array(train_features))

    if i == 0: dnn_model = build_and_compile_model(normalizer)
    history = dnn_model.fit(
      train_features,
      train_labels,
      validation_split=0.2,
      epochs=9)
    model_name = "dnn_model_k_fold_" + str(i+1)
    test_results[model_name] = dnn_model.evaluate(np.log(test_features), test_labels, verbose=0)[1:3] # 0 index is loss MAE
    plot_loss(history)
    plt.savefig(model_name)
  dnn_model.save("crash_prediction_dnn_model_v4.keras")
  pd.DataFrame(test_results, index=['MSE','MAE']).T.to_csv('test-fold.csv')
  return dnn_model,test_features,test_labels

if __name__ == "__main__":
  # Loading dataset
  url = 'ADT_Crashes.csv'
  column_names = ['Length', 'ADT', 'Crashes']
  raw_dataset = pd.read_csv(url, names=column_names,
                            na_values='?', comment='\t',
                            sep=' ', skipinitialspace=True)
  raw_dataset = pd.read_csv(url)

  kfold_dataset = raw_dataset.copy() # Dataset for k-fold cross validation
  model,test_feats,test_labs = kfold(kfold_dataset)

  # Random dataset split for exploratory data analysis
  dataset = raw_dataset.copy()
  train_dataset = dataset.sample(frac=0.8, random_state=0) # 80-20 training-testing split
  test_dataset = dataset.drop(train_dataset.index)

  # Pairplot exploratory data visualizations
  train_dataset.corr().to_csv('train_dataset_corr.csv')
  pairplot(train_dataset)
  log_pairplot(train_dataset)

  # Evaluation plots
  test_predictions(test_labs,test_feats,"crash_prediction_dnn_model_v4.keras")