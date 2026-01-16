import nltk

dir = "/var/task/nltk_data"

nltk.download("punkt", download_dir=dir)
nltk.download("punkt_tab", download_dir=dir)
nltk.download("averaged_perceptron_tagger_eng", download_dir=dir)
nltk.download("averaged_perceptron_tagger", download_dir=dir)
