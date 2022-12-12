import { createAudioMp3Mock } from '@/mocks/audio-mp3.mock';
import { AudioModel } from '@/models/audio.model';
import AudioService from '@/services/audio.service';
import { usePlayerStore, usePlaylistStore } from '@/app/stores';
import { reactive, onBeforeMount, toRefs } from 'vue';

/**
 * Бизнес-логика для работы с плеером
 *
 * @returns Свойства и методы для работы с плеером
 */
export const usePlayer = () => {
  /**
   * Хранилище данных плеера
   */
  const playerStore = usePlayerStore();

  /**
   * Хранилище данных текущего плейлиста
   */
  const playlistStore = usePlaylistStore();

  /**
   * Свойства стейта из хранилища плеера,
   * которые необходимы для компонентов
   */
  const { audio, playing, stoped, duration, elapsedSeconds, hasError } = toRefs(
    playerStore.$state
  );

  /**
   * Инициализация плейлиста и плеера
   */
  onBeforeMount(() => {
    playlistStore.setup([
      createAudioMp3Mock(),
      createAudioMp3Mock(),
      createAudioMp3Mock(),
      createAudioMp3Mock(),
    ]);

    const firstTrack = playlistStore.first();
    if (firstTrack) initTrack(firstTrack);
  });

  /**
   * Инициализация трека
   *
   * @param audio Аудио для инициализации
   * @param playNow Флаг для воспроизведения сразу после инициализации
   */
  const initTrack = (audio: AudioModel, playNow = false) => {
    AudioService.change(audio, () => {
      playerStore.setup(audio);

      if (playNow) {
        play();
      }
    });
  };

  /**
   * Воспроизведение трека
   *
   * @async
   */
  const play = async () => {
    try {
      await AudioService.play();

      playerStore.setPlayed();

      AudioService.listenTimeChange((seconds) =>
        playerStore.setSecondsElapsed(seconds)
      );

      AudioService.listenTrackEnd(() => next());
    } catch {
      playerStore.setError();
    }
  };

  /**
   * Остановка трека на паузу
   */
  const pause = () => {
    AudioService.pause();
    playerStore.setPaused();
  };

  /**
   * Полная остановка трека
   */
  const stop = () => {
    AudioService.stop();
    playerStore.setStoped();
  };

  /**
   * Проматывание трека до указанной секунды
   *
   * @param seconds Секунда, до которой нужно проматать трек
   */
  const skipTo = (seconds: number) => {
    AudioService.setCurrentTime(seconds);
    playerStore.setSecondsElapsed(seconds);
  };

  /**
   * Переключение на предыдущий трек
   */
  const prev = () => {
    const prevTrack = playlistStore.prev();
    if (prevTrack) initTrack(prevTrack, true);
  };

  /**
   * Переключение на следующий трек
   */
  const next = () => {
    const nextTrack = playlistStore.next();
    if (nextTrack) initTrack(nextTrack, true);
  };

  return reactive({
    audio,
    playing,
    stoped,
    duration,
    elapsedSeconds,
    hasError,

    play,
    pause,
    stop,
    skipTo,
    prev,
    next,
  });
};
