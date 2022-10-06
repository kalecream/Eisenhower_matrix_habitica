import next from "next";
import { useState, useEffect, Component } from "react";
import Pomodoro from "./Pomodoro";
import'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer, toast} from'react-toastify'; 


const creator = "a80214a4-2868-4f11-aa34-bb6327c57b9c";
const project_name = "EisenHower";

interface Props {
	apiKey: string;
	user: string;
}

interface Tags {
	important: string;
	urgent: string;
}

export default function EisenHower(props: Props) {
	let [_do, setDo] = useState([""]);
	let [defer, setDefer] = useState([""]);
	let [delegate, setDelegate] = useState([""]);
	let [_delete, setDelete] = useState([""]);
	let [pomodoro, setPomodoro] = useState("");
	let taskCompleteSound = new Audio("/public/audio/mixhit-unlock-game-notification-253.wav");
	let pomCompleteSound = new Audio("/public/audio/mixhit-achievement-bell-600.wav");

	async function getTags(
		apiKey: string,
		user: string
	): Promise<Tags | undefined> {
		try {
			let res = await fetch("https://habitica.com/api/v3/user", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": apiKey,
					"x-api-user": user,
					"x-client": creator + "-" + project_name,
				},
			});
			let data = await res.json();
			let tags = data.data.tags;
			let important = tags.filter(
				(tag: any) => tag.name.toLowerCase() == "important"
			);
			let urgent = tags.filter(
				(tag: any) => tag.name.toLowerCase() == "urgent"
			);
			return { important: important[0].id, urgent: urgent[0].id };
		} catch (err) {
			console.log(err);
		}
	}

	async function getTasks() {
		try {
			let res = await fetch("https://habitica.com/api/v3/tasks/user", {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": props.apiKey,
					"x-api-user": props.user,
					"x-client": creator + "-" + project_name,
				},
			});
			return await res.json();
		} catch (err) {
			console.log(err);
		}
	}

	async function place_task_in_appropriate_square(
		squares: any,
		task: any,
		tags: Tags
	) {
		let isImporant = task.tags.includes(tags?.important);
		let isUrgent = task.tags.includes(tags?.urgent);
		if (isImporant && isUrgent) return squares._do.push(task);
		if (isImporant) return squares.defer.push(task);
		if (isUrgent) return squares.delegate.push(task);
		squares._delete.push(task);
	}

	async function generateMatrix(data: any) {
		try {
			let dailyTasks = data.data.filter(
				(task: any) => task.type == "daily" || task.type == "todo"
			);
			let tags: Tags | undefined = await getTags(props.apiKey, props.user);
			if (tags === undefined) throw "can't generate matrix, couldn't find tags";
			let squares = {
				_do: [],
				defer: [],
				delegate: [],
				_delete: [],
			};
			for (let i = 0; i < dailyTasks.length; i++) {
				if (dailyTasks[i].completed) continue;
				place_task_in_appropriate_square(squares, dailyTasks[i], tags);
			}
			return squares;
		} catch (err) {
			console.log(err);
		}
	}

	function checkOff(id: string, setState: any) {
		fetch(`https://habitica.com/api/v3/tasks/${id}/score/up`, {
			method: "POST",
			headers: {
				"x-api-key": props.apiKey,
				"x-api-user": props.user,
			},
		})
			.then((res) => {
				switch (res.status) {
					case 200:
						taskCompleteSound.play();
						toast.success('successful', {
							position: toast.POSITION.BOTTOM_CENTER,
							autoClose:2000})
						setState((tasks: any[]) => tasks.filter((task) => task.id !== id));
						break;
					case 404:
						console.log("task not found");
						break;
					case 202:
						alert("approval was requested for team task");
						break;
				}
			})
			.catch((err) => {
				console.log(err);
			});
	}

	function put_task_text_in_ul(tasks: any, callBack: any): string[] {
		return tasks?.map((task: any) => (
			<button onClick={() => checkOff(task.id, callBack) } className="task-button" key={task.id}>
				<label>{task.text}</label>
			</button>
		));
	}
	useEffect(() => {
		console.log("we are loading");
		(async function () {
			let data = await getTasks();
			let squares = await generateMatrix(data);
			setDo(squares?._do || []);
			setDefer(squares?.defer || []);
			setDelegate(squares?.delegate || []);
			setDelete(squares?._delete || []);
		})();
	}, []);

	return (
		<div className="wrapper">
			<div className="grid">
				<div className="sector do">
				<div className="action">
					<div className="task-count">{_do.length}</div>
					<h2>Do</h2>
				</div>
				<ul>{put_task_text_in_ul(_do, setDo)}</ul>
				</div>
				<div className="sector defer">
					<div className="action">
						<div className="task-count">{defer.length}</div>
						<h2>defer</h2>
					</div>
					<ul>{put_task_text_in_ul(defer, setDefer)}</ul>
				</div>
				<div className="sector delegate">
					<div className="action">
						<div className="task-count">{delegate.length}</div>
						<h2>delegate</h2>
					</div>
					<ul>{put_task_text_in_ul(delegate, setDelegate)}</ul>
				</div>
				<div className="sector delete">
					<div className="action">
						<div className="task-count">{_delete.length}</div>
						<h2>delete</h2>
					</div>
					<ul>{put_task_text_in_ul(_delete, setDelete)}</ul>
				</div>
			</div>
			<div className="stats-wrapper">
				<ToastContainer />
				<Pomodoro stopPomodoro={() => {setPomodoro}} />
			</div>
			
		</div>
	);
}
