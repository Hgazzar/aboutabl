import { Box, Button, Text, Title, Anchor, Group } from '@mantine/core';
import { Link } from 'react-router-dom';

/**
 * Public landing: Home / About / Contact + single entry to student sign-in.
 * Teachers use the Aboutabl admin app; students sign in below.
 */
export default function Landing() {
	return (
		<Box className="min-h-screen bg-PaoloVeroneseGreen text-white">
			<Box className="max-w-5xl mx-auto px-6 py-8">
				<Group position="apart" className="mb-12">
					<Title order={3}>Aboutabl</Title>
					<Group spacing="md">
						<Anchor href="#about" c="white" sx={{ '&:hover': { textDecoration: 'underline' } }}>
							About
						</Anchor>
						<Anchor href="#contact" c="white" sx={{ '&:hover': { textDecoration: 'underline' } }}>
							Contact
						</Anchor>
						<Button component={Link} to="/login" variant="white" color="dark">
							Sign in
						</Button>
					</Group>
				</Group>

				<Box id="home" className="py-10">
					<Title order={1} className="text-4xl md:text-5xl mb-4">
						Learn smarter with Aboutabl
					</Title>
					<Text className="text-lg opacity-90 max-w-2xl mb-8">
						One place for your subjects, assignments, quizzes, and progress. Students and staff each use the portal that fits their role —
						start below with the student sign-in.
					</Text>
					<Button component={Link} to="/login" size="lg" variant="white" color="dark">
						Student &amp; teacher sign in
					</Button>
					<Text size="sm" className="mt-4 opacity-80">
						Teachers who manage classes and content: use the <strong>Aboutabl admin</strong> web app with your school account.
					</Text>
				</Box>

				<Box id="about" className="py-16 border-t border-white/20">
					<Title order={2} className="mb-4">
						About
					</Title>
					<Text className="opacity-90 max-w-3xl leading-relaxed">
						Aboutabl helps schools deliver structured subjects, multimedia lessons, quizzes, games, and worksheets. Track assignments and
						stay on top of due dates from your dashboard.
					</Text>
				</Box>

				<Box id="contact" className="py-16 border-t border-white/20">
					<Title order={2} className="mb-4">
						Contact
					</Title>
					<Text className="opacity-90">
						For support or school onboarding, please contact your school administrator or the Aboutabl team.
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
