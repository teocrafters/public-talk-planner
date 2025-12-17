type JobStatus = "pending" | "processing" | "completed" | "failed"

type MatchStatus = "new" | "update" | "no-change" | "restore"

interface SpeakerDiff {
	phone?: {
		old: string
		new: string
	}
	talks?: {
		added: number[]
		removed: number[]
		unchanged: number[]
	}
	congregation?: {
		oldId: string
		oldName: string
		newId: string
		newName: string
	}
}

interface ExistingSpeaker {
	id: string
	phone: string
	congregationId: string
	congregationName: string
	talkIds: number[]
}

interface Job {
	status: JobStatus
	data?: {
		congregation: string
		congregationId: string | null
		speakers: {
			firstName: string
			lastName: string
			phone: string
			talkNumbers: string[]
			congregationId: string | null
			congregation: string
			talkIds: number[]
			selected: boolean
			matchStatus: MatchStatus
			matchedSpeakerId?: string
			existingSpeaker?: ExistingSpeaker
			diff?: SpeakerDiff
		}[]
		missingSpeakers: {
			id: string
			firstName: string
			lastName: string
			congregationName: string
			assignedTalks: string[]
			scheduledTalksCount: number
			selected: boolean
		}[]
	}
	error?: string
	createdAt: number
}

const jobs = new Map<string, Job>()

export function createJob(jobId: string): void {
	jobs.set(jobId, {
		status: "pending",
		createdAt: Date.now(),
	})
}

export function getJob(jobId: string): Job | undefined {
	return jobs.get(jobId)
}

export function updateJob(jobId: string, updates: Partial<Job>): void {
	const job = jobs.get(jobId)
	if (job) {
		jobs.set(jobId, { ...job, ...updates })
	}
}

export function deleteJob(jobId: string): void {
	jobs.delete(jobId)
}

export function cleanupOldJobs(): void {
	const now = Date.now()
	const oneHour = 60 * 60 * 1000

	for (const [jobId, job] of jobs.entries()) {
		if (now - job.createdAt > oneHour) {
			jobs.delete(jobId)
		}
	}
}

setInterval(cleanupOldJobs, 10 * 60 * 1000)
