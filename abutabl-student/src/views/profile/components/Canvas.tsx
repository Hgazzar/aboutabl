import React, { useRef, useEffect } from 'react';

interface CanvasProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
	angle: number; // Angle in degrees
	pieColors: {
		background: string;
		color: string;
	};
}

const Canvas: React.FC<CanvasProps> = ({ angle, pieColors, ...props }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const context = canvas.getContext('2d');
		if (!context) return;

		// Clear the canvas
		context.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 28;
		const startAngle = 0;
		const endAngle = (angle / 100) * (Math.PI * 2);
		const anticlockwise = false;

		context.beginPath();
		context.moveTo(centerX, centerY);
		context.arc(centerX, centerY, radius, startAngle, endAngle, anticlockwise);
		context.lineTo(centerX, centerY);
		context.closePath();

		// Set the fill and stroke styles
		context.fillStyle = pieColors.color; // Set your desired color
		context.fill();
		// context.strokeStyle = 'black'; // Set your desired color
		// context.stroke();
	}, [angle]);

	return <canvas ref={canvasRef} width={56} height={56} {...props} />;
};

export default Canvas;
