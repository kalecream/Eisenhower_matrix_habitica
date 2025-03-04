import { useState, useEffect, useMemo } from "react";
import styles from "../styles/Pomodoro.module.css";

interface Props {
  stopPomodoro: () => void;
}

export default function Pomodoro(props: Props) {
  const [seconds, setSeconds] = useState(0);
  const [miliseconds, setMiliSeconds] = useState(0);
  const [timeLimit, setTimeLimit] = useState(25);
  const [time, setTime] = useState(`${timeLimit}:00`);

  function updateTime(time: string) {
    let [minutes, seconds] = time.split(":").map((str) => Number(str));
    seconds -= 1;
    if (seconds < 0) {
      [minutes, seconds] = minutes === 0 ? [0, 0] : [minutes - 1, 59];
    }
    if (seconds < 10) return `${minutes}:0${seconds}`;
    return `${minutes}:${seconds}`;
  }

  function calculateProgress(iterator: number, minutes: number) {
    return (360 * ((iterator + 1) / (minutes * 60))) / 10;
  }

  useEffect(() => {
    let new_time = updateTime(time);
    setTime(new_time);
    console.log(time);
    if (time == "0:01") {
      console.log("done");
      props.stopPomodoro();
    }
  }, [seconds]);

  useEffect(() => {
    setTime(`${timeLimit}:00`);
    setSeconds(0);
    setMiliSeconds(0);
    let i = 0;
    let interval: any = setInterval(() => {
      if (timeLimit * 60 === i / 10) return clearInterval(interval);
      if (i % 10 === 0) setSeconds((i + 1) / 10);
      setMiliSeconds(i + 1);
      i += 1;
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [timeLimit]);

  let progress = useMemo(
    () => calculateProgress(miliseconds, timeLimit),
    [miliseconds, timeLimit]
  );

  return (
    <div className={styles.pom}>
      <button className={styles.pom__button}>
        <span id="timer" className={styles.pom__time}>{time}</span>
        <p className={styles.pom__words}>until break</p>
      </button>
      <div className={styles.pom__round}>
        {/* {round}/4 */}
      </div>
      <div className="stats">
        
      </div>
    </div>
  );
}
