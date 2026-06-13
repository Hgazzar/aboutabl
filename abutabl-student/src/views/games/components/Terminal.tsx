import { useEffect, useRef, useState } from 'react';

const DEFAULT_LINES = [
	'> new user connected...',
	'> welcome to hacking game...',
	'> please choose password...',
	'> Hack complete!',
];

type Props = {
	lines?: string[];
	/** If set (including empty string), replaces the default “Access Granted!” tail. */
	finalExtra?: string;
	children: React.ReactNode;
	className?: string;
};

export function Terminal({ lines = DEFAULT_LINES, finalExtra, children, className }: Props) {
	const tail = finalExtra !== undefined ? finalExtra : '\nAccess Granted!\n';
	const [typed, setTyped] = useState('');
	const [done, setDone] = useState(false);
	const timers = useRef<number[]>([]);

	useEffect(() => {
		let cancelled = false;
		const push = (fn: () => void, ms: number) => {
			const t = window.setTimeout(fn, ms);
			timers.current.push(t);
		};

		const typeLine = (line: string, speedMs: number) =>
			new Promise<void>((resolve) => {
				let i = 0;
				const step = () => {
					if (cancelled) return resolve();
					if (i >= line.length) return resolve();
					setTyped((prev) => prev + line[i]);
					i += 1;
					push(step, speedMs);
				};
				step();
			});

		const run = async () => {
			for (const raw of lines) {
				if (cancelled) return;
				const line = `${raw}\n`;
				await typeLine(line, 50);
				await new Promise<void>((r) => push(() => r(), 1000));
			}
			if (cancelled) return;
			setTyped((t) => t + tail);
			push(() => setDone(true), 1000);
		};

		void run();

		return () => {
			cancelled = true;
			timers.current.forEach((t) => window.clearTimeout(t));
			timers.current = [];
		};
	}, [lines, tail]);

	return (
		<div className={`hackterminal ${className || ''}`}>
			<div className="background" />
			<div className="terminal">
				{typed}
				{!done ? <span className="cursor" /> : null}
			</div>
			<div className="buttons" style={{ display: done ? 'flex' : 'none', flexWrap: 'wrap', gap: 8 }}>
				{done ? children : null}
			</div>
		</div>
	);
}
