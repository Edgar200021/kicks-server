import {
	AsyncTask,
	SimpleIntervalJob,
	type ToadScheduler,
} from "toad-scheduler";
import type { UserRepository } from "../repository/user.repository.js";

export class UserService {
	constructor(
		protected readonly userRepository: UserRepository,
		protected readonly scheduler: ToadScheduler,
	) {
		scheduler.addSimpleIntervalJob(
			new SimpleIntervalJob(
				{ hours: 1, runImmediately: true },
				new AsyncTask("Delete not verified users", () => {
					return userRepository.deleteNotVerified();
				}),
			),
		);
	}
}
