import { Stores } from '@/shared/constants';
import { AudioModel, AudioService } from '@/entities/audio';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Хранилище данных для аудио
 *
 * @return {object} Публичные методы и свойства для работы с хранилищем
 */
export const useAudioStore = defineStore(Stores.AUDIO, () => {
  /**
   * Информация об аудио
   */
  const audio = ref<AudioModel | null>(null);

  /**
   * Состояние воспроизведения
   */
  const playing = ref<boolean>(false);

  /**
   * Состояние об остановке воспроизведения
   */
  const stoped = ref<boolean>(true);

  /**
   * Количество прошедших секунд с момента воспроизведения
   */
  const elapsedSeconds = ref<number>(0);

  /**
   * Имеются ли ошибки при воспроизведении
   */
  const hasError = ref<boolean>(false);

  /**
   * Общее кол-во времени трека
   */
  const duration = ref<number>(0);

  /**
   * Инициализация трека в хранилище
   *
   * @param newAudio Новое аудио
   */
  const setup = (
    newAudio: AudioModel,
    playNow = false,
    onTrackEnd?: () => void
  ) => {
    reset();

    AudioService.change(newAudio, () => {
      audio.value = newAudio;
      duration.value = AudioService.duration;

      if (playNow) {
        play();
      }

      AudioService.listenTrackEnd(() => {
        stop();

        if (onTrackEnd) onTrackEnd();
      });
    });
  };

  /**
   * Выставление состояния для воспроизведения
   */
  const setPlaying = () => {
    playing.value = true;
    stoped.value = false;
  };

  /**
   * Воспроизведение трека
   *
   * @async
   */
  const play = async () => {
    try {
      await AudioService.play();

      setPlaying();

      AudioService.listenTimeChange((seconds) => setElapsedSeconds(seconds));
    } catch {
      setError();
    }
  };

  /**
   * Выставление состояния для паузы
   */
  const setPaused = () => {
    playing.value = false;
    stoped.value = false;
  };

  /**
   * Остановка трека на паузу
   */
  const pause = () => {
    AudioService.pause();

    setPaused();
  };

  /**
   * Выставление состояния для полной остановки воспроизведения
   */
  const setStoped = () => {
    playing.value = false;
    stoped.value = true;
  };

  /**
   * Полная остановка трека
   */
  const stop = () => {
    AudioService.stop();

    setStoped();
  };

  /**
   * Выставление количество пройденных секунд с момента воспроизведения
   *
   * @param seconds Количество секунд
   */
  const setElapsedSeconds = (seconds: number) => {
    elapsedSeconds.value = seconds;
  };

  /**
   * Проматывание трека до указанной секунды
   *
   * @param seconds Секунда, до которой нужно проматать трек
   */
  const skipTo = (seconds: number) => {
    AudioService.setCurrentTime(seconds);

    setElapsedSeconds(seconds);
  };

  /**
   * Пометить наличие ошибки
   */
  const setError = () => {
    hasError.value = true;
  };

  /**
   * Сброс данных хранилища до исходных значений
   */
  const reset = () => {
    audio.value = null;
    playing.value = false;
    stoped.value = true;
    elapsedSeconds.value = 0;
    hasError.value = false;
    duration.value = 0;
  };

  return {
    audio,
    playing,
    stoped,
    elapsedSeconds,
    hasError,
    duration,

    setup,
    play,
    pause,
    stop,
    skipTo,
  };
});
