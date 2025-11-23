import { sql } from "kysely";
import {
	AsyncTask,
	SimpleIntervalJob,
	type ToadScheduler,
} from "toad-scheduler";
import type { UsersRepository } from "../repository/users.repository.js";

export class UsersService {
	constructor(
		protected readonly usersRepository: UsersRepository,
		protected readonly scheduler: ToadScheduler,
	) {
		scheduler.addSimpleIntervalJob(
			new SimpleIntervalJob(
				{ hours: 1, runImmediately: true },
				new AsyncTask("Delete not verified users", () => {
					return usersRepository.deleteNotVerified();
				}),
			),
		);
	}
}
