import { sql } from "kysely";
import {
	AsyncTask,
	SimpleIntervalJob,
	type ToadScheduler,
} from "toad-scheduler";
import type { UsersRepository } from "../repository/users.repository.js";

export class UserService {
	constructor(
		readonly usersRepository: UsersRepository,
		scheduler: ToadScheduler,
	) {
		scheduler.addSimpleIntervalJob(
			new SimpleIntervalJob(
				{ hours: 1, runImmediately: true },
				new AsyncTask("Delete not verified users", () => {
					console.log("sds");
					return usersRepository.deleteNotVerified();
				}),
			),
		);
	}
}
